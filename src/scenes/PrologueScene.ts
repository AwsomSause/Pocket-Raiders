// Story Overhaul S2: the prologue shell. Look and mode, Beat 1 (cold open), Beat 2 (the station),
// Beat 3 (Professor Vance), Beat 4 (name and pronouns) and Beat 10 (departure). Beats 5 to 9 belong to
// other slices and are skipped here. All rules live in core/story2/{identity,prologue}.ts.

import Phaser from 'phaser';
import { playStoryMusic } from '../ui/audio';
import { VANCE_ANIMS, VANCE_FRAMES, type VanceAnim } from '../assets/catalog';
import { services } from '../game/services';
import { loadAssets, queueAssets } from '../ui/lazyAssets';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu, type MenuOption } from '../ui/widgets';
import { drawBackdrop } from '../ui/widgets';
import { mountRedux, reduxOn, type ReduxCtx, type ReduxView } from '../ui/redux/stage';
import { talkView } from '../ui/redux/screens/talk';
import { cutBeat, cutView } from '../ui/redux/screens/cut';
import { beatTag, formView, typeKey, vanceLine } from '../ui/redux/screens/prologue';
import { pageLines, pageSpeaker } from '../ui/redux/script';
import { playerPortrait, portrait, type Art } from '../ui/redux/templates';
import type { ProfileStory, StoryData } from '../core/story2/schema';
import { chooseNextBackstory, chooseNextLine, intakeChoices, quizQuestions, revealPicks, saveQuizResult } from '../core/story2/intake';
import { enabledBackstories } from '../core/story2/module';
import { playerAnimId } from '../assets/playerArt';
import { LOOKS, lookReady, previewSentence, renderTokens, vanceTone, type PronounSet, type Tone } from '../core/story2/identity';
import { BEATS, beatsFor, canSkipPrologue, chooseMode, prologueRequired, finishPrologue, markBeat, quickStartOffered, requiredObjects, setIdentity, setLook, setTone, shortIntake, type BeatId, type PrologueMode } from '../core/story2/prologue';
import { BACKSTORY_PITCH, BACKSTORY_PROMPT, INTAKE_STARTER_PROMPT, QUICK_QUIZ_INTRO, QUIZ_INTRO, REVEAL_INTRO, REVEAL_LABELS, STARTER_PROMPT, BRIEFING, FIRST_NAME_USE, MONTAGE, OBJECTS, PRONOUN_PROMPT, QUICK_OBJECTS, VANCE_CLOSING, VANCE_NAME_PROMPT, VANCE_OPENING, VANCE_QUESTIONS } from '../core/story2/prologueText';

const VANCE_ANIM_IDS = VANCE_ANIMS.map((n) => `story.vance.${n}`);
const VANCE_SIDE = 400;
const VANCE_SCALE = 2.5;
/** The run mode (runRules.json) that plays the Orrery Circuit as a Story Run. */
export const STORY_RUN_MODE = 'story-run';

type Step = 'intake' | 'look' | 'mode' | BeatId;

/** A box the player types in: the page's own input in Old, a plain value the New UI's name entry edits. */
interface TextBox { value: string; focus: (o?: FocusOptions) => void }

/** New UI: what the current step put on screen, written down by the layout helpers so the mock-up page can show it. */
interface RxPage {
  title: string;
  lines: string[];
  options: MenuOption[];
  next: (() => void) | null;
  notice: string;
  vance: VanceAnim | null;
  /** The name entry: its boxes and which one is typed in. */
  fields: { label: string; max: number; box: TextBox }[];
  field: number;
  /** A cutscene card instead of a page (the opening shots, the departure): pages of name and line; `skip` leaves early. */
  cut: { pages: { name: string; line: string }[]; beat: number | null; who: 'me' | 'vance'; skip: (() => void) | null } | null;
  /** Looks to show as the picture, one per option. */
  looks: PlayerLookId[] | null;
}
type PlayerLookId = 'a' | 'b';
const emptyPage = (): RxPage => ({ title: '', lines: [], options: [], next: null, notice: '', vance: null, fields: [], field: 0, cut: null, looks: null });
/** New UI: the backdrop of the station's rooms and how big Professor Vance's 160-pixel frames are drawn. */
const RX_ROOM = 'packs/memories/eventbg/indoor.png';
const VANCE_FRAME = 160;

export class PrologueScene extends Phaser.Scene {
  private menu: Menu | null = null;
  private inputs: HTMLInputElement[] = [];
  private mode: PrologueMode = 'full';
  private tones: Tone[] = [];
  private examined = new Set<string>();
  private shot = 0;
  private pronounPick: 'she' | 'he' | 'they' | 'custom' | null = null;
  private onConfirm: (() => void) | null = null;
  /** Width the Vance picture takes on the right while she is on screen (text and menus keep clear of it). */
  private sideW = 0;
  /** Opened from the title's Story Run entry: finishing goes on to trainer choice for a Story Run. */
  private thenRun = false;
  /** New UI: the mock-up layer, the page being shown, which page of its text is up, and what was last drawn. */
  private rx: ReduxView | null = null;
  private rxM: RxPage = emptyPage();
  private rxAt = 0;
  private rxSig = '';
  /** New UI: the frame a step was drawn in (the key press that opened it must not also act on it). */
  private rxOpened = -1;

  constructor() {
    super('Prologue');
  }

  preload(): void {
    queueAssets(this, VANCE_ANIM_IDS);
  }

  /**
   * Shows Professor Vance on the right, looping one of her animations (static first frame when motion is reduced or off).
   * Drawing only: nothing here changes the story, and a missing sheet just leaves her out.
   */
  private vance(anim: VanceAnim): void {
    const key = `story.vance.${anim}`;
    this.rxM.vance = anim;
    if (!this.textures.exists(key)) return;
    this.sideW = VANCE_SIDE;
    const sprite = this.add.sprite(GAME_WIDTH - VANCE_SIDE / 2 - 20, GAME_HEIGHT - 20, key, 0).setOrigin(0.5, 1).setScale(VANCE_SCALE);
    sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const calm = services().session.settings.animationIntensity === 'reduced' || services().session.settings.battleAnimations !== 'full';
    if (calm) return;
    if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: VANCE_FRAMES - 1 }), frameRate: 8, repeat: -1 });
    sprite.play(key);
  }

  private get story() {
    return services().session.profile.story;
  }

  private edit(change: (s: ProfileStory) => ProfileStory): void {
    services().session.changeProfile((p) => ({ ...p, story: change(p.story) }));
  }

  create(data?: { thenRun?: boolean }): void {
    this.thenRun = data?.thenRun === true;
    this.tones = [];
    this.examined.clear();
    this.shot = 0;
    this.pronounPick = null;
    drawBackdrop(this);
    this.rx = null;
    this.rxM = emptyPage();
    this.rxAt = 0;
    this.rxSig = '';
    onInputAction(this, (a) => {
      if (this.rx) return this.rxInput(a);
      if (this.menu) this.menu.handle(a);
      else if (a === 'confirm') this.onConfirm?.();
    });
    this.events.once('shutdown', () => this.clearInputs());
    if (reduxOn()) this.mountRx();
    this.go(this.story.prologue.done ? 'intake' : 'look');
  }

  // ---------- layout helpers ----------

  private clear(): void {
    this.menu?.destroy();
    this.menu = null;
    this.onConfirm = null;
    this.clearInputs();
    this.sideW = 0;
    this.children.removeAll(true);
    drawBackdrop(this);
    this.rxM = emptyPage();
    this.rxAt = 0;
    this.rxOpened = this.time.now;
  }

  private clearInputs(): void {
    this.inputs.forEach((el) => el.remove());
    this.inputs = [];
  }

  private title(text: string): void {
    this.rxM.title = text;
    this.add.text(GAME_WIDTH / 2, 28, text, textStyle(30, COLORS.textLight)).setOrigin(0.5);
  }

  private body(lines: string[], y = 90): number {
    this.rxM.lines.push(...lines);
    const t = this.add.text(60, y, lines.join('\n\n'), textStyle(20, COLORS.text, { wordWrap: { width: GAME_WIDTH - 120 - this.sideW } }));
    return y + t.height + 16;
  }

  private choose(options: MenuOption[], onSelect: (i: number) => void, y: number, onBack?: () => void, initialIndex?: number): void {
    this.menu?.destroy();
    this.rxM.options = options;
    this.menu = new Menu(this, { x: 60, y, options, itemWidth: GAME_WIDTH - 120 - this.sideW, itemHeight: 40, fontSize: 20, onSelect, onBack, initialIndex });
  }

  private next(text: string, fn: () => void): void {
    this.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 30, text, textStyle(16, '#8a7f96')).setOrigin(1, 0.5);
    this.onConfirm = fn;
    this.rxM.next = fn;
    this.input.once('pointerup', fn);
  }

  private inputBox(label: string, y: number, value = '', max = 14): TextBox {
    if (this.rx) {
      // New UI: the mock-ups' name entry types into a plain value (keys, the on-screen grid, paste); no page input.
      const box: TextBox = { value, focus: () => { this.rxM.field = Math.max(0, this.rxM.fields.findIndex((f) => f.box === box)); } };
      this.rxM.fields.push({ label, max, box });
      return box;
    }
    this.add.text(60, y - 22, label, textStyle(15, '#c9bfd6'));
    const el = document.createElement('input');
    el.type = 'text';
    el.value = value;
    el.maxLength = max;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('aria-label', label);
    el.dataset.testid = `prologue-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    Object.assign(el.style, { position: 'fixed', zIndex: '20', boxSizing: 'border-box', font: '16px monospace', padding: '0 12px', border: '2px solid #6fd0ff', borderRadius: '12px', background: '#10203a', color: '#ffffff', outline: 'none' } satisfies Partial<CSSStyleDeclaration>);
    el.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.onConfirm?.();
    });
    document.body.appendChild(el);
    const place = () => {
      const rect = this.game.canvas.getBoundingClientRect();
      const k = rect.width / GAME_WIDTH;
      Object.assign(el.style, { left: `${rect.left + 60 * k}px`, top: `${rect.top + y * k}px`, width: `${360 * k}px`, height: `${36 * k}px`, fontSize: `${Math.max(16, 18 * k)}px` });
    };
    place();
    this.scale.on('resize', place, this);
    this.events.on('postupdate', place, this);
    this.events.once('shutdown', () => { this.scale.off('resize', place, this); this.events.off('postupdate', place, this); });
    this.inputs.push(el);
    return el;
  }

  private say(text: string): void {
    this.rxM.notice = text;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, text, textStyle(17, '#f0e0a0', { align: 'center', wordWrap: { width: GAME_WIDTH - 80 } })).setOrigin(0.5).setName('notice');
  }

  // ---------- New UI: the mock-up pages ----------

  /**
   * New UI: the prologue drawn as the mock-ups: a talk page (the event look) for the station, Professor Vance and the
   * choices, a cutscene card for the opening shots and the departure, and the name entry for the name and custom
   * pronouns. The steps above stay as they are: the layout helpers write down what a step shows, and this draws it.
   */
  private mountRx(): void {
    this.rx = mountRedux(this, {
      render: (c) => this.rxRender(c),
      acts: {
        pick: (i) => {
          if (!this.menu) return void this.onConfirm?.();
          this.menu.focus(Number(i), false);
          this.menu.confirm();
        },
        page: () => this.rxTurn(1),
        next: () => this.rxInput('confirm'),
        key: (k) => this.rxType(String(k), true),
        ok: () => this.onConfirm?.(),
        clear: () => this.rxEdit(() => ''),
        paste: () => void navigator.clipboard?.readText().then((t) => this.rxPaste(t)).catch(() => undefined),
        field: (k) => { this.rxM.field = Number(k); },
      },
      overs: { over: (i) => { if (this.menu && !this.rxM.options[Number(i)]?.disabled) this.menu.focus(Number(i), false); } },
    });
    const onKey = (e: KeyboardEvent): void => this.rxKey(e);
    const onPaste = (e: ClipboardEvent): void => this.rxPaste(e.clipboardData?.getData('text') ?? '');
    this.input.keyboard?.on('keydown', onKey);
    window.addEventListener('paste', onPaste);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', onKey);
      window.removeEventListener('paste', onPaste);
    });
  }

  override update(): void {
    if (!this.rx) return;
    const m = this.rxM;
    const sig = [this.menu?.index ?? -1, this.rxAt, m.title, m.lines.join('\n'), m.notice, m.vance, m.field, m.fields.map((f) => f.box.value).join('\u0001'), m.options.map((o) => `${o.label}${o.disabled ? '!' : ''}`).join('\u0001'), m.cut?.pages[0]?.line ?? ''].join('\u0002');
    if (sig === this.rxSig) return;
    this.rxSig = sig;
    this.rx.refresh();
  }

  /** The step's text as pages of at most 240 letters. */
  private rxPages() {
    const m = this.rxM;
    // What was just examined (or what went wrong) is read in place of the step's opening words, which were read already.
    const pages = pageLines(m.notice ? m.notice.split('\n').map((text) => ({ who: null, text })) : m.lines.map(vanceLine), 240);
    return pages.length ? pages : [[{ who: null, text: '' }]];
  }

  private rxTurn(by: number): void {
    const to = this.rxAt + by;
    if (to < 0 || to >= (this.rxM.cut ? this.rxM.cut.pages.length : this.rxPages().length)) return;
    this.rxAt = to;
  }

  /** New UI input: pages turn first; on the last page the menu (or Continue) takes over. The name entry reads raw keys instead. */
  private rxInput(a: Parameters<Menu['handle']>[0]): void {
    const m = this.rxM;
    if (m.fields.length) return;
    const pages = m.cut ? m.cut.pages.length : this.rxPages().length;
    if (this.rxAt < pages - 1) {
      if (a === 'confirm') this.rxTurn(1);
      else if (a === 'back') m.cut?.skip ? m.cut.skip() : this.rxTurn(-1);
      return;
    }
    if (m.cut && a === 'back' && m.cut.skip) return m.cut.skip();
    if (m.cut && a !== 'confirm') return;
    if (this.menu && !m.next) this.menu.handle(a);
    else if (a === 'confirm') this.onConfirm?.();
  }

  private rxEdit(change: (value: string, max: number) => string): void {
    const f = this.rxM.fields[this.rxM.field];
    if (f) f.box.value = change(f.box.value, f.max);
  }

  private rxType(key: string, fromGrid = false): void {
    this.rxEdit((v, max) => typeKey(v, key, max, fromGrid));
  }

  private rxPaste(text: string): void {
    for (const ch of text.replace(/[\r\n]/g, '')) this.rxType(ch);
  }

  /** The name entry's keys: letters type, Backspace deletes, Tab or the arrows change box, Enter confirms, Esc goes back. */
  private rxKey(e: KeyboardEvent): void {
    const m = this.rxM;
    if (!m.fields.length || this.time.now === this.rxOpened) return;
    if (e.key === 'Enter') return void this.onConfirm?.();
    if (e.key === 'Escape') return void this.menu?.handle('back');
    if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      m.field = (m.field + (e.key === 'ArrowUp' || e.shiftKey ? m.fields.length - 1 : 1)) % m.fields.length;
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    this.rxType(e.key);
  }

  private rxRender(c: ReduxCtx): string {
    const m = this.rxM;
    const look: PlayerLookId = this.story.protagonist.look === 'look_b' ? 'b' : 'a';
    // The mock-ups draw the story's two big portraits from one frame of their sheets, larger than a Trainer picture:
    // Vance at 0.9 and the player at 0.8 of the page's figure scale (3.4 on a talk page; 5, 4.6 or 5.6 on a cutscene
    // card, by layout). A card stands them a little under its bottom edge: those rows of the frame are left off.
    const [cutScale, cutSunk, cutBase] = ([[5, 38, 344], [4.6, 0, 284], [5.6, 58, 356]] as const)[c.v(3)]!;
    const me = (cut = false): Art => (cut ? playerPortrait(look, cutScale, cutSunk, cutBase) : playerPortrait(look));
    const vance = (anim: VanceAnim, cut = false): Art => (cut ? portrait(`packs/vance/${anim}.png`, VANCE_FRAME, 0.9, cutScale, cutSunk, cutBase) : portrait(`packs/vance/${anim}.png`, VANCE_FRAME, 0.9));
    if (m.cut) {
      const at = Math.min(this.rxAt, m.cut.pages.length - 1), page = m.cut.pages[at]!;
      return cutView(c, { name: page.name, role: 'Prologue', line: page.line, cast: m.cut.who === 'vance' ? vance(m.vance ?? 'confident', true) : me(true), backdrop: m.cut.who === 'vance' ? 'arenas/grass_bg.png' : 'arenas/power_plant_bg.png', beat: m.cut.beat ?? Math.max(0, 4 - (m.cut.pages.length - 1 - at)), skip: m.cut.skip ? ['Esc', 'skip'] : ['Enter', 'next'] });
    }
    if (m.fields.length) {
      const f = m.fields[Math.min(m.field, m.fields.length - 1)]!;
      const first = m.lines[0] ? vanceLine(m.lines[0]) : null;
      const one = m.fields.length === 1;
      return formView(c, {
        title: 'Name and pronouns',
        prompt: one && first?.who ? first.text : f.label,
        value: f.box.value,
        fields: m.fields.map((x) => ({ label: x.label, value: x.box.value })),
        field: m.field,
        ok: one ? 'That is me' : 'Confirm',
        note: [...(one && first?.who ? m.lines.slice(1) : m.lines).map((l) => vanceLine(l).text), m.notice].filter(Boolean).join(' '),
      });
    }
    const pages = this.rxPages(), at = Math.min(this.rxAt, pages.length - 1), page = pages[at]!;
    const { tag, name } = beatTag(m.title, BEATS.length);
    const index = this.menu?.index ?? 0;
    return talkView(c, {
      name,
      tag: m.looks && !this.story.prologue.done ? 'First launch' : tag,
      lines: page,
      speaker: pageSpeaker(page),
      page: { at, of: pages.length },
      art: RX_ROOM, tint: null, fx: null,
      cast: m.looks ? (m.looks[index] === 'b' ? portrait('packs/mc/look_b/portrait.png', 128, 0.8) : playerPortrait('a')) : m.vance ? vance(m.vance) : pageSpeaker(page)?.startsWith('Prof. Vance') ? vance('confident') : me(),
      mon: null,
      choices: m.next ? [{ label: 'Continue', sub: '', chance: '', locked: false }] : m.options.map((o) => ({ label: o.label, sub: '', chance: '', locked: !!o.disabled })),
      index: m.next ? 0 : index,
      money: null,
      outcome: null,
      pick: null,
      countdown: '',
      timer: null,
    });
  }

  // ---------- flow ----------

  private go(step: Step): void {
    this.clear();
    switch (step) {
      case 'intake': return this.stepIntake();
      case 'look': return this.stepLook();
      case 'mode': return this.stepMode();
      case 'cold_open': return this.stepMontage();
      case 'station': return this.stepStation();
      case 'professor': this.tones = []; this.gettingToIt = false; return this.stepProfessor(0);
      case 'identity': return this.stepName();
      case 'quiz': this.answers = {}; return this.stepQuiz(0);
      case 'reveal': return this.stepReveal();
      case 'backstory': return this.stepBackstory();
      case 'starter': return this.stepStarter();
      case 'briefing': return this.stepBriefing();
      default: return this.advance(step); // beats other slices own
    }
  }

  /** The next built beat after `after`; beats that are not built yet are skipped. */
  private advance(after: Step): void {
    this.edit((s) => (BEATS.some((b) => b.id === after) ? markBeat(s, after as BeatId) : s));
    const order = beatsFor(this.mode);
    const at = order.indexOf(after as BeatId);
    const rest = order.slice(at + 1);
    const nxt = rest.find((id) => BEATS.find((b) => b.id === id)?.built);
    this.go(nxt ?? 'briefing');
  }

  private stepIntake(): void {
    const s = this.story;
    const intake = shortIntake(s)!;
    this.title('Lantern Hollow Field Station');
    let y = this.body([`VANCE: ${renderTokens(intake.greeting, { name: s.protagonist.name, pronouns: s.protagonist.pronouns })}`, ...(intake.extraLine ? [`VANCE: ${intake.extraLine}`] : [])]);
    if (intake.extraLine) this.edit((st) => markBeat(st, 'intake'));
    y += 10;
    const opts = [...(this.thenRun ? [{ label: 'Begin the Story Run' }] : []), { label: 'Replay the prologue' }, ...(prologueRequired(this.story) ? [] : [{ label: 'Back to the title' }])];
    this.choose(opts, (i) => {
      const pick = opts[i]!.label;
      if (pick === 'Begin the Story Run') { this.intake = true; return this.go('backstory'); }
      if (pick === 'Replay the prologue') return this.go('look');
      this.leave(false);
    }, y, () => this.leave(false));
  }

  private stepLook(): void {
    this.title('This is how you appear');
    this.edit((st) => markBeat(st, 'look')); // the opening is only forced on a launch until this screen has been seen once
    const y = this.body(['Choose your Look. Your name and pronouns come later, and the Look never changes them. You can change the Look in Settings.']);
    // A portrait preview above each Look, lined up with its menu entry.
    const looks = LOOKS.filter((l) => lookReady(l.id));
    const ids = looks.map((l) => (l.id === 'look_b' ? playerAnimId('b', 'portrait') : 'boss.hilda'));
    void loadAssets(this, ids).then(() => {
      if (!this.sys.isActive()) return;
      looks.forEach((l, n) => {
        const x = GAME_WIDTH / 2 + (n - (looks.length - 1) / 2) * 220;
        (l.id === 'look_b' ? this.add.image(x, 400, ids[n]!, '0001.png').setScale(1.5) : this.add.image(x, 400, ids[n]!).setScale(3)).setOrigin(0.5, 1);
        this.add.text(x, 410, l.label, textStyle(20, COLORS.text)).setOrigin(0.5, 0);
      });
    });
    const options: MenuOption[] = looks.map((l) => ({ label: l.label }));
    this.rxM.looks = looks.map((l) => (l.id === 'look_b' ? 'b' : 'a'));
    this.choose(options, (i) => {
      const look = looks[i]!;
      this.edit((st) => setLook(st, look.id).story);
      this.go(quickStartOffered(this.story) ? 'mode' : this.startBeats());
    }, y + 10, () => this.leave());
  }

  private startBeats(): Step {
    return beatsFor(this.mode).find((id) => BEATS.find((b) => b.id === id)?.built && id !== 'look') ?? 'briefing';
  }

  private stepMode(): void {
    this.title('How long do you want the opening?');
    const y = this.body(['The full opening is the default. Quick Start keeps the heart of it. Nothing is cut for good: the opening can be replayed from the title screen.']);
    const modes: { label: string; mode: PrologueMode }[] = [
      { label: 'Full Story (about 25 minutes)', mode: 'full' },
      { label: 'Quick Start (about 6 minutes)', mode: 'quick' },
      ...(canSkipPrologue(this.story) ? [{ label: 'Skip Prologue (later saves only)', mode: 'skipped' as const }] : []),
    ];
    this.choose(modes.map((m) => ({ label: m.label })), (i) => {
      this.mode = modes[i]!.mode;
      this.edit((st) => chooseMode(st, this.mode));
      this.go(this.startBeats());
    }, y, () => this.go('look'));
  }

  private stepMontage(): void {
    const m = MONTAGE[this.shot]!;
    this.title(`Opening  ${this.shot + 1} / ${MONTAGE.length}`);
    this.body([m.shot, `VANCE (a recording): "${m.line}"`], 140);
    this.next('Enter to continue', () => {
      if (this.shot + 1 >= MONTAGE.length) return this.advance('cold_open');
      this.shot += 1;
      this.go('cold_open');
    });
    // New UI: each opening shot is a cutscene card (the shot, then the recording's words); the strip follows the shots.
    this.rxM.cut = { pages: [{ name: 'The Opening', line: `${m.shot} “${m.line}”` }], beat: cutBeat(this.shot, MONTAGE.length), who: 'me', skip: prologueRequired(this.story) ? null : () => this.advance('cold_open') };
    if (prologueRequired(this.story)) return;
    const skip = this.add.text(40, GAME_HEIGHT - 30, 'Skip opening', textStyle(16, '#c9bfd6')).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    skip.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); this.advance('cold_open'); });
  }

  private stepStation(note = '', at = 0): void {
    this.clear();
    const need = this.mode === 'quick' ? QUICK_OBJECTS : OBJECTS.map((o) => o.id);
    this.title('Beat 2: The station');
    const y = this.body(['Lantern Hollow Field Station, a lighthouse with a greenhouse bolted to its side. Examine what you like' + (this.mode === 'quick' ? ' (the map and the clipping are the ones that matter).' : ' (all five).')], 80);
    const options: MenuOption[] = OBJECTS.map((o) => ({ label: `${this.examined.has(o.id) ? '✓ ' : ''}${o.name}` }));
    const ready = requiredObjects(this.mode) === 0 || need.every((id) => this.examined.has(id));
    options.push({ label: ready ? 'Go and meet the Professor' : 'Go and meet the Professor  (examine the objects first)', disabled: !ready });
    this.choose(options, (i) => {
      if (i === OBJECTS.length) return this.advance('station');
      const o = OBJECTS[i]!;
      this.examined.add(o.id);
      this.stepStation(o.lines.join('\n'), i);
    }, y, undefined, at);
    if (note) this.say(note);
  }

  private stepProfessor(q: number, reply = ''): void {
    this.clear();
    const lastQ = this.mode === 'full' ? VANCE_QUESTIONS.length : 1;
    this.title('Beat 3: Professor Vance');
    if (q >= lastQ) {
      const tone = vanceTone(this.tones);
      this.vance(tone === 'formal' ? 'confident' : tone === 'playful' ? 'surprised' : 'explain');
      this.edit((s) => setTone(s, tone, this.gettingToIt));
      this.body([reply && `VANCE: ${reply}`, `VANCE: ${VANCE_CLOSING[tone]}`, `VANCE: ${VANCE_NAME_PROMPT}`].filter(Boolean) as string[], 80);
      return this.next('Enter to continue', () => this.advance('professor'));
    }
    const question = VANCE_QUESTIONS[q]!;
    this.vance(q === 0 && !reply ? 'nudge' : reply ? 'explain' : 'tilt');
    // The opening already ends on the first question's words, so they are not said twice.
    const intro = q === 0 ? VANCE_OPENING.filter((l) => l !== `VANCE: ${question.prompt}`) : reply ? [`VANCE: ${reply}`] : [];
    const y = this.body([...intro, `VANCE: ${question.prompt}`], 80);
    this.choose(question.options.map((o) => ({ label: o.text })), (i) => {
      const pick = question.options[i]!;
      this.tones.push(pick.tone);
      if (pick.flag === 'getting_to_it') this.gettingToIt = true;
      this.stepProfessor(q + 1, pick.reply);
    }, y);
  }
  private gettingToIt = false;

  // ---------- Beats 5 to 8: quiz, reveal, backstory, first partner (core/story2/intake.ts) ----------

  /** Quiz answers (question id to answer id), the drafted picks, and whether this is the Short Intake (Begin the Story Run). */
  private answers: Record<string, string> = {};
  private picks: StoryData['remembrances'] = [];
  private intake = false;
  /** The Intake Interview: the Short Intake's quick quiz; after the reveal it goes back to the partner pick. */
  private interview = false;

  private get quickQuiz(): boolean {
    return this.mode === 'quick' || this.interview;
  }

  private stepQuiz(i: number): void {
    this.clear();
    const data = services().session.content.storyData;
    const qs = quizQuestions(data, this.quickQuiz);
    if (i >= qs.length) return this.interview ? this.go('reveal') : this.advance('quiz');
    if (i === 0) playStoryMusic(this, 'mu_quiz_lab_base');
    const q = qs[i]!;
    this.title(`Beat 5: The quiz (${i + 1} of ${qs.length})`);
    this.vance(i % 3 === 0 ? 'tilt' : i % 3 === 1 ? 'explain' : 'nudge');
    // Answers show in a fixed order per question that is not the data order, so a screen position never maps to one trait.
    const turn = [...q.id].reduce((n, c) => n + c.charCodeAt(0), 0) % q.answers.length;
    const shown = [...q.answers.slice(turn), ...q.answers.slice(0, turn)];
    const y = this.body([...(i === 0 ? [this.quickQuiz ? QUICK_QUIZ_INTRO : QUIZ_INTRO] : []), `VANCE: ${data.text[q.textKey] ?? q.id}`], 80);
    this.choose(shown.map((a) => ({ label: data.text[a.textKey] ?? a.id })), (k) => {
      this.answers[q.id] = shown[k]!.id;
      this.stepQuiz(i + 1);
    }, y, i > 0 ? () => this.stepQuiz(i - 1) : undefined);
  }

  private stepReveal(): void {
    const { content } = services().session;
    const r = revealPicks(content.storyData, this.story, this.answers, this.quickQuiz);
    this.picks = r.picks;
    this.edit((s) => saveQuizResult(s, r.traitVector, r.picks));
    this.title('Beat 6: The reveal');
    this.vance('surprised');
    const lines = r.picks.map((p, i) => `${REVEAL_LABELS[i] ?? 'Also'}: ${this.lineLabel(p)}`);
    const y = this.body([REVEAL_INTRO, ...lines], 80);
    this.choose([{ label: 'Continue' }, { label: 'Retake the quiz' }], (i) => {
      if (i === 1) { this.answers = {}; return this.stepQuiz(0); }
      if (this.interview) { this.interview = false; return this.stepStarter(); }
      this.advance('reveal');
    }, y);
  }

  /** "Charmander (Fire), Brave": the line's first stage, its types and its Temperament. */
  private lineLabel(r: StoryData['remembrances'][number]): string {
    const { content } = services().session;
    const sp = content.species.get(r.line[0]!);
    const types = r.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join('/');
    return `${sp?.name ?? r.line[0]} (${types}), ${r.temperament.replace(/^tm_/, '').replace(/^./, (c) => c.toUpperCase())}`;
  }

  private stepBackstory(): void {
    const { content } = services().session;
    const ids = enabledBackstories(content);
    const nameOf = (id: string): string => {
      const b = content.storyData.backstories.find((x) => x.id === id);
      return (b && content.storyData.text[b.nameKey]) || id;
    };
    this.title('Beat 7: Backstory');
    let y = this.body([BACKSTORY_PROMPT], 70);
    const list = this.add.text(60, y - 6, ids.map((id) => `${nameOf(id)}: ${BACKSTORY_PITCH[id] ?? ''}`).join('\n'), textStyle(15, '#c9bfd6', { wordWrap: { width: GAME_WIDTH - 120 }, lineSpacing: 4 }));
    this.rxM.lines.push(...ids.map((id) => `${nameOf(id)}: ${BACKSTORY_PITCH[id] ?? ''}`));
    y += list.height + 4;
    this.choose(ids.map((id) => ({ label: nameOf(id) })), (i) => {
      this.edit((s) => chooseNextBackstory(s, ids[i]!));
      if (this.intake) return this.go('starter');
      this.advance('backstory');
    }, y, this.intake ? () => this.go('intake') : undefined);
  }

  private stepStarter(): void {
    this.clear();
    const { content } = services().session;
    const data = content.storyData;
    // Without a quiz this time (Skip Prologue, the Short Intake): the last quiz's picks and Archive lines, else a neutral draft.
    let choices = this.picks.length > 0 ? this.picks : intakeChoices(data, this.story);
    if (choices.length === 0) choices = revealPicks(data, this.story, {}, false).picks;
    this.title('Beat 8: First partner');
    this.vance('confident');
    const y = this.body([this.intake ? INTAKE_STARTER_PROMPT : STARTER_PROMPT], 80);
    const shown = choices.slice(0, 6);
    const opts = [...shown.map((r) => ({ label: this.lineLabel(r) })), ...(this.intake ? [{ label: 'Take the Intake Interview (6 questions)' }] : [])];
    this.choose(opts, (i) => {
      if (i >= shown.length) { this.interview = true; this.answers = {}; return this.stepQuiz(0); }
      this.edit((s) => chooseNextLine(s, shown[i]!.id));
      this.picks = [];
      if (this.intake) return this.leave(true);
      this.advance('starter');
    }, y, this.intake ? () => this.go('backstory') : undefined);
  }

  private stepName(error = '', keep = ''): void {
    this.clear();
    this.title('Beat 4: Identity');
    this.vance('adjust');
    this.body(['VANCE: For the record. Your name?', 'Name: 1 to 12 letters, numbers, spaces, hyphens or apostrophes.'], 80);
    const box = this.inputBox('Name', 250, keep || this.story.protagonist.name);
    box.focus({ preventScroll: true });
    const confirm = () => {
      const r = setIdentity(this.story, box.value, 'they');
      if (!r.ok && r.error !== 'Pick one.') return void this.stepName(r.error, box.value);
      this.nameDraft = box.value;
      this.stepPronouns();
    };
    this.onConfirm = confirm;
    this.choose([{ label: 'Confirm' }, { label: 'Back' }], (i) => (i === 0 ? confirm() : this.go('professor')), 310, () => this.go('professor'));
    if (error) this.say(error);
  }
  private nameDraft = '';

  private stepPronouns(error = ''): void {
    this.clear();
    this.title('Beat 4: Identity');
    this.vance('tilt');
    const y = this.body([`VANCE: ${PRONOUN_PROMPT}`], 80);
    const mark = (k: string) => (this.pronounPick === k ? '● ' : '○ ');
    const options: MenuOption[] = [
      { label: `${mark('she')}she/her` }, { label: `${mark('he')}he/him` }, { label: `${mark('they')}they/them` }, { label: `${mark('custom')}Custom` },
      { label: 'Confirm', disabled: this.pronounPick === null }, { label: 'Back' },
    ];
    this.choose(options, (i) => {
      if (i <= 3) {
        this.pronounPick = (['she', 'he', 'they', 'custom'] as const)[i]!;
        return this.pronounPick === 'custom' ? this.stepCustom() : this.stepPronouns();
      }
      if (i === 5) return this.stepName('', this.nameDraft);
      this.finishIdentity(this.pronounPick!);
    }, y, () => this.stepName('', this.nameDraft));
    if (error) this.say(error);
  }

  private stepCustom(error = ''): void {
    this.clear();
    this.title('Beat 4: Custom pronouns');
    this.body(['Four words, each 2 to 12 letters: he/him style. For example: xe, xem, xyr, xemself.'], 70);
    const boxes = ['Subject (they)', 'Object (them)', 'Possessive (their)', 'Reflexive (themself)'].map((l, i) => this.inputBox(l, 190 + i * 62, this.customDraft[i] ?? '', 12));
    boxes[0]!.focus({ preventScroll: true });
    const read = (): PronounSet => ({ subj: boxes[0]!.value, obj: boxes[1]!.value, poss: boxes[2]!.value, reflexive: boxes[3]!.value });
    const confirm = () => {
      this.customDraft = boxes.map((b) => b.value);
      const r = setIdentity(this.story, this.nameDraft, read());
      if (!r.ok) return this.stepCustom(r.error);
      this.finishIdentity(read());
    };
    this.onConfirm = confirm;
    this.choose([{ label: 'Confirm' }, { label: 'Back' }], (i) => (i === 0 ? confirm() : this.stepPronouns()), 440, () => this.stepPronouns());
    if (error) this.say(error);
  }
  private customDraft: string[] = [];

  private finishIdentity(pick: 'she' | 'he' | 'they' | 'custom' | PronounSet): void {
    const choice = pick === 'custom' ? ({ subj: this.customDraft[0] ?? '', obj: this.customDraft[1] ?? '', poss: this.customDraft[2] ?? '', reflexive: this.customDraft[3] ?? '' } satisfies PronounSet) : pick;
    const r = setIdentity(this.story, this.nameDraft, choice);
    if (!r.ok) return this.stepPronouns(r.error);
    this.edit(() => r.story);
    if (this.mode === 'full') return this.stepPreview();
    this.stepFirstUse();
  }

  private stepPreview(): void {
    this.clear();
    this.title('Beat 4: Read it back');
    this.vance('nudge');
    const p = this.story.protagonist;
    const y = this.body([`VANCE: Let me read it back. "${previewSentence({ name: p.name, pronouns: p.pronouns })}"`], 90);
    this.choose([{ label: 'Looks right' }, { label: 'Change' }], (i) => (i === 0 ? this.stepFirstUse() : this.stepPronouns()), y);
  }

  private stepFirstUse(): void {
    this.clear();
    this.title('Beat 4: Identity');
    this.vance('explain');
    const p = this.story.protagonist;
    this.body([renderTokens(FIRST_NAME_USE, { name: p.name, pronouns: p.pronouns })], 110);
    this.next('Enter to continue', () => this.advance('identity'));
  }

  private stepBriefing(): void {
    this.clear();
    this.title('Beat 10: Departure');
    this.vance('confident');
    const p = this.story.protagonist;
    const y = this.body([...BRIEFING.map((l) => renderTokens(l, { name: p.name, pronouns: p.pronouns })), 'Your identity is saved.'], 80);
    this.choose([{ label: this.thenRun ? 'Begin the Story Run' : 'Finish' }], () => {
      this.edit(finishPrologue);
      this.leave(true);
    }, y);
    // New UI: the departure is a cutscene card, one page for each thing Vance says; the last page finishes.
    this.rxM.cut = { pages: BRIEFING.map((l) => ({ name: 'Departure', line: vanceLine(renderTokens(l, { name: p.name, pronouns: p.pronouns })).text })), beat: null, who: 'vance', skip: null };
  }

  /** Back to the title, or (when opened for a Story Run and `go` is true) on to trainer choice in Story Run mode. */
  private leave(go = false): void {
    this.clearInputs();
    if (go && this.thenRun) this.scene.start('TrainerSelect', { modeId: STORY_RUN_MODE });
    else this.scene.start('MainMenu');
  }
}
