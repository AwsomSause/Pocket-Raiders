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
import { boardView } from '../ui/redux/screens/evilBoard';
import { boardModel, dispatchRows, newDispatch, type DispatchDraft } from '../core/evilMode/boardScreens';
import { JOB_METHODS, type JobMethod } from '../core/evilMode/schema';
import { GAME_WIDTH } from '../ui/theme';

export class EvilScene extends Phaser.Scene {
  private view: ReduxView | null = null;
  private draft: FoundingDraft = newDraft();
  private disp: DispatchDraft = newDispatch();
  private notice: string | null = null;
  private input_: HTMLInputElement | null = null;
  private leaving = false;

  constructor() {
    super('Evil');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141414');
    this.draft = newDraft();
    this.disp = newDispatch();
    this.notice = null;
    this.leaving = false;
    const { session } = services();
    if (!session.run) return void this.scene.start('MainMenu');
    session.evilEnsure();
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
        if (block?.district) {
          const frame = frameModel(block, archetype.name);
          if (block.district.end) frame.button = 'Leave';
          return frameView(c, frame, this.notice, boardView(boardModel(block, this.disp), frame, this.notice));
        }
        if (block) return frameView(c, frameModel(block, archetype.name), this.notice);
        return foundingView(c, foundingModel(this.draft, { bossName: archetype.name, bossFile, starter: species?.name ?? '—', starterFile, oldLook, length: services().session.settings.expansion.evilRunLength }));
      },
      acts: {
        pick: (i) => this.pick(Number(i)),
        next: () => this.next(),
        back: () => this.back(),
        suggest: (n) => this.setName(n),
        advance: () => this.advance(),
        cell: (i) => this.cell(Number(i)),
        crew: (id) => this.toggleCrew(id),
        how: () => this.toHow(),
        method: (i) => { this.disp = { ...this.disp, how: Number(i), step: 'how' }; this.view?.refresh(); },
        offer: (pct) => { this.disp = { ...this.disp, offer: Number(pct) }; this.view?.refresh(); },
        queue: () => this.queue(),
        clear: (id) => { services().session.evilStep({ type: 'clearJob', holdingId: id }); this.view?.refresh(); },
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
    if (this.founded()) return this.dayKey(a);
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

  /** The beat strip's button: ends the beat. When the district's over it leaves (the run is saved). */
  private advance(): void {
    const block = services().session.run?.expansion?.evilMode;
    if (!block) return;
    if (block.district?.end) return this.leave();
    const cues = services().session.evilStep({ type: BEAT_END[block.here.beat] });
    const refused = cues.find((c) => c.id === 'refused');
    this.notice = refused && 'reason' in refused ? refused.reason : null;
    this.disp = { ...newDispatch(), at: this.disp.at };
    this.view?.refresh();
  }

  private block() {
    return services().session.run?.expansion?.evilMode;
  }

  /** Keys on the Board and in Dispatch (design Part 29 section 18): every job can be built and queued without a pointer. */
  private dayKey(a: InputAction): void {
    const block = this.block();
    if (!block?.district) return a === 'confirm' ? this.advance() : a === 'back' ? this.leave() : undefined;
    const d = this.disp;
    const dispatching = block.here.beat === 'dispatch' && !block.district.end;
    if (!dispatching) {
      if (a === 'confirm') return this.advance();
      if (a === 'back') return this.leave();
      const by = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -10 : a === 'down' ? 10 : 0;
      this.disp = { ...d, at: Math.max(0, Math.min(19, d.at + by)) };
      return this.view?.refresh();
    }
    if (d.step === 'where') {
      const rows = dispatchRows(block);
      if (a === 'back') return this.leave();
      if (a === 'confirm') return d.onSend ? this.advance() : this.cell(d.at);
      const by = a === 'up' || a === 'left' ? -1 : a === 'down' || a === 'right' ? 1 : 0;
      // The list's rows, then "Send them" as one more row.
      const pos = d.onSend ? rows.length : Math.max(0, rows.indexOf(d.at));
      const next = (pos + by + rows.length + 1) % (rows.length + 1);
      this.disp = next === rows.length ? { ...d, onSend: true } : { ...d, onSend: false, at: rows[next]! };
      return this.view?.refresh();
    }
    if (d.step === 'who') {
      const n = block.crew.length + 1;
      if (a === 'back') this.disp = { ...d, step: 'where' };
      else if (a === 'up' || a === 'down') this.disp = { ...d, who: (d.who + (a === 'up' ? -1 : 1) + n) % n };
      else if (a === 'confirm') return d.who === block.crew.length ? this.toHow() : this.toggleCrew(block.crew[d.who]!.id);
      return this.view?.refresh();
    }
    // How: left/right the seven methods; up/down the Pay offer; Enter queues.
    if (a === 'back') this.disp = { ...d, step: 'who' };
    else if (a === 'left' || a === 'right') this.disp = { ...d, how: (d.how + (a === 'left' ? -1 : 1) + EVIL_DATA.methods.length) % EVIL_DATA.methods.length };
    else if (a === 'up' || a === 'down') {
      const offers = EVIL_DATA.district.methods.pay.offers.map((o) => o.pct);
      const i = offers.indexOf(d.offer);
      this.disp = { ...d, offer: offers[(i + (a === 'up' ? -1 : 1) + offers.length) % offers.length]! };
    } else if (a === 'confirm') return this.queue();
    this.view?.refresh();
  }

  /** A holding pressed: on the Board it's looked at; in Dispatch it's where the job goes, and Who is next. */
  private cell(i: number): void {
    const block = this.block();
    if (!block?.district) return;
    const dispatching = block.here.beat === 'dispatch' && !block.district.end;
    this.disp = { ...this.disp, at: i, onSend: false, ...(dispatching ? { step: 'who' as const, who: 0 } : {}) };
    this.notice = null;
    this.view?.refresh();
  }

  private toggleCrew(id: string): void {
    const d = this.disp;
    const squad = d.squad.includes(id) ? d.squad.filter((x) => x !== id) : [...d.squad, id];
    this.disp = { ...d, squad, step: 'who' };
    this.view?.refresh();
  }

  private toHow(): void {
    const block = this.block();
    if (!block) return;
    const d = this.disp;
    // Start on the first built method that this holding offers (the screen never recommends one; this is only the cursor).
    const first = EVIL_DATA.methods.findIndex((m) => (JOB_METHODS as readonly string[]).includes(m.id));
    this.disp = { ...d, step: 'how', how: d.step === 'how' ? d.how : first };
    this.view?.refresh();
  }

  private queue(): void {
    const d = this.disp;
    const block = this.block();
    const h = block?.district?.holdings[d.at];
    const m = EVIL_DATA.methods[d.how];
    if (!h || !m || !(JOB_METHODS as readonly string[]).includes(m.id)) return;
    const method = m.id as JobMethod;
    const cues = services().session.evilStep({ type: 'queueJob', job: { holdingId: h.id, method, squad: d.squad, ...(method === 'pay' ? { offer: d.offer } : {}) } });
    const refused = cues.find((c) => c.id === 'refused');
    if (refused && 'reason' in refused) this.notice = refused.reason;
    else {
      this.notice = `Queued: step ${h.step}, ${m.name}.`;
      this.disp = { ...newDispatch(), at: d.at };
    }
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
