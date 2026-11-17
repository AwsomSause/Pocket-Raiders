// Evil Mode (design plans/evil-mode, build plan slice 1 "the shell"): Founding, then the day's frame.
// The scene is the controller: it keeps the founding draft and the input, and asks the session to found the team or
// step the day (saved at the end of every beat). Evil Mode is drawn in the New look only: with Old selected, the New
// layer is mounted for this screen and one line says so; the setting itself is never changed.

import Phaser from 'phaser';
import { getArchetype } from '../core/archetypes';
import { BEAT_END } from '../core/evilMode/day';
import { EVIL_DATA } from '../core/evilMode/data';
import { allSuggestions, choiceOf, FOUNDING_PAGES, foundingModel, frameModel, moveLine, newDraft, pageReady, type FoundingDraft } from '../core/evilMode/screens';
import { pokemonAssetIds, type AssetManifest } from '../assets/catalog';
import { services } from '../game/services';
import { onInputAction, type InputAction } from '../ui/input';
import { rxFileOf } from '../ui/redux/assets';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { foundingView, frameView } from '../ui/redux/screens/evilFounding';
import { GAME_WIDTH } from '../ui/theme';

export class EvilScene extends Phaser.Scene {
  private view: ReduxView | null = null;
  private draft: FoundingDraft = newDraft();
  private notice: string | null = null;
  private input_: HTMLInputElement | null = null;
  private leaving = false;

  constructor() {
    super('Evil');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141414');
    this.draft = newDraft();
    this.notice = null;
    this.leaving = false;
    const { session } = services();
    if (!session.run) return void this.scene.start('MainMenu');
    const manifest = this.cache.json.get('manifest') as AssetManifest | undefined;
    const run = session.run;
    const archetype = getArchetype(session.content, run.archetypeId);
    const lead = run.party[0];
    const species = lead ? session.content.species.get(lead.speciesId) : undefined;
    const bossFile = rxFileOf(manifest, archetype.spriteAssetId)?.file ?? null;
    const starterFile = species ? rxFileOf(manifest, pokemonAssetIds(species.assets).front)?.file ?? null : null;
    const oldLook = !reduxOn();
    this.view = mountRedux(this, {
      render: (c) => {
        const r = services().session.run;
        const block = r?.expansion?.evilMode;
        if (block) return frameView(c, frameModel(block, archetype.name), this.notice);
        return foundingView(c, foundingModel(this.draft, { bossName: archetype.name, bossFile, starter: species?.name ?? '—', starterFile, oldLook, length: services().session.settings.expansion.evilRunLength }));
      },
      acts: {
        pick: (i) => this.pick(Number(i)),
        next: () => this.next(),
        back: () => this.back(),
        suggest: (n) => this.setName(n),
        advance: () => this.advance(),
      },
      overs: { over: (i) => { if (!this.founded()) { this.draft = { ...this.draft, at: Number(i) }; this.view?.refresh(); } } },
    });
    onInputAction(this, (a) => this.key(a));
    this.events.on('postupdate', this.place, this);
    this.events.once('shutdown', () => {
      this.events.off('postupdate', this.place, this);
      this.dropInput();
    });
    this.syncInput();
  }

  private founded(): boolean {
    return !!services().session.run?.expansion?.evilMode;
  }

  private key(a: InputAction): void {
    if (this.leaving) return;
    if (this.founded()) {
      if (a === 'confirm') this.advance();
      else if (a === 'back') this.leave();
      return;
    }
    const d = this.draft;
    if (a === 'confirm') return this.next();
    if (a === 'back') return this.back();
    if (d.page === 'line' && (a === 'left' || a === 'right')) return this.pick(['clean', 'grey', 'whatever'].indexOf(moveLine(d.line, a === 'left' ? -1 : 1)));
    const n = d.page === 'creed' ? EVIL_DATA.creeds.length : d.page === 'doctrine' ? EVIL_DATA.doctrines.length : d.page === 'name' ? allSuggestions().length : 0;
    if (!n) return;
    // Cards sit in rows of three (Creeds) or four (Doctrines); suggestions are one list.
    const row = d.page === 'creed' ? 3 : d.page === 'doctrine' ? 4 : 1;
    const step = a === 'up' ? -row : a === 'down' ? row : a === 'left' ? -1 : a === 'right' ? 1 : 0;
    if (!step) return;
    const at = (d.at + step + n) % n;
    this.draft = { ...d, at };
    if (d.page === 'name') return this.setName(allSuggestions()[at]!);
    this.pick(at);
  }

  /** Choosing a card or a stop on the current page. */
  private pick(i: number): void {
    const d = this.draft;
    if (d.page === 'creed') this.draft = { ...d, at: i, creed: EVIL_DATA.creeds[i]?.id ?? d.creed };
    else if (d.page === 'doctrine') this.draft = { ...d, at: i, doctrine: EVIL_DATA.doctrines[i]?.id ?? d.doctrine };
    else if (d.page === 'line') this.draft = { ...d, at: i, line: (['clean', 'grey', 'whatever'] as const)[i] ?? d.line };
    this.view?.refresh();
  }

  private setName(name: string): void {
    this.draft = { ...this.draft, name };
    if (this.input_) this.input_.value = name;
    this.view?.refresh();
  }

  private next(): void {
    const d = this.draft;
    if (!pageReady(d)) return;
    if (d.page === 'summary') {
      if (!d.confirming) {
        this.draft = { ...d, confirming: true };
        return this.view?.refresh();
      }
      const problem = services().session.evilFound(choiceOf(d));
      if (problem) this.notice = problem;
      this.syncInput();
      return this.view?.refresh();
    }
    const i = FOUNDING_PAGES.indexOf(d.page);
    const page = FOUNDING_PAGES[i + 1]!;
    const at = page === 'creed' ? Math.max(0, EVIL_DATA.creeds.findIndex((c) => c.id === d.creed)) : page === 'doctrine' ? Math.max(0, EVIL_DATA.doctrines.findIndex((x) => x.id === d.doctrine)) : page === 'line' ? ['clean', 'grey', 'whatever'].indexOf(d.line) : 0;
    this.draft = { ...d, page, at, confirming: false };
    this.syncInput();
    this.view?.refresh();
  }

  private back(): void {
    const d = this.draft;
    if (d.confirming) {
      this.draft = { ...d, confirming: false };
      return this.view?.refresh();
    }
    const i = FOUNDING_PAGES.indexOf(d.page);
    // Back on the first page leaves (the run stays saved; Continue comes back to Founding).
    if (i === 0) return this.leave();
    this.draft = { ...d, page: FOUNDING_PAGES[i - 1]!, at: 0 };
    this.syncInput();
    this.view?.refresh();
  }

  /** The beat strip's button: ends the beat (slice 1's beats are empty). */
  private advance(): void {
    const block = services().session.run?.expansion?.evilMode;
    if (!block) return;
    services().session.evilStep({ type: BEAT_END[block.here.beat] });
    this.notice = null;
    this.view?.refresh();
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    const { session } = services();
    if (!session.saveAndLeaveRun()) {
      this.leaving = false;
      this.notice = 'The run could not be saved.';
      return this.view?.refresh();
    }
    this.scene.start('MainMenu');
  }

  /** The name page's real text box (phones show their own keyboard), laid over the page's field. */
  private syncInput(): void {
    const want = !this.founded() && this.draft.page === 'name';
    if (!want) return this.dropInput();
    if (this.input_) return;
    const el = document.createElement('input');
    el.type = 'text';
    el.value = this.draft.name;
    el.maxLength = EVIL_DATA.founding.names.maxLength;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('aria-label', 'Team name');
    el.dataset.testid = 'evil-name-input';
    Object.assign(el.style, { position: 'fixed', zIndex: '41', boxSizing: 'border-box', border: '0', background: 'transparent', padding: '0 10px', outline: 'none', fontWeight: '700' } satisfies Partial<CSSStyleDeclaration>);
    el.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.next();
      else if (e.key === 'Escape') this.back();
    });
    el.addEventListener('input', () => {
      this.draft = { ...this.draft, name: el.value };
      this.view?.refresh();
    });
    document.body.appendChild(el);
    this.input_ = el;
    this.place();
    el.focus({ preventScroll: true });
  }

  private dropInput(): void {
    this.input_?.remove();
    this.input_ = null;
  }

  private place(): void {
    const el = this.input_;
    if (!el) return;
    const field = this.view?.el.querySelector<HTMLElement>('.ev-field');
    if (!field) return void (el.style.display = 'none');
    const f = field.getBoundingClientRect(), look = getComputedStyle(field);
    const k = this.game.canvas.getBoundingClientRect().width / GAME_WIDTH;
    Object.assign(el.style, { display: '', left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, fontSize: `${Math.max(16, 22 * k)}px`, fontFamily: look.fontFamily, color: look.color });
  }
}
