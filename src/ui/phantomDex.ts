// Phantom UI: the Pokédex that opens from the pause menu (mock-ups `dex`, `dexentry`, `types`). It keeps where the
// player is (which set, which species, which page) and turns an input into the next place; the scene that owns the
// pause menu draws `html()` on its own view and passes its inputs on. It only reads: the profile, what this run has
// met and caught so far (the run's own log, which the run's end banks into the profile) and the game's type chart.
// Nothing here changes a run, a save or a roll. Q and E turn the set, C changes the filter (or plays the
// cry on an entry), T opens the type chart.

import type Phaser from 'phaser';
import { collectionSets, researchTotals, type CollectionSet } from '../core/collection';
import { tallyOf } from '../core/dexResearch';
import { nextGoal, RANK_NAMES, rankIndex, speciesRank } from '../core/mastery';
import { dexCard, dexDataPage, dexState, liveDexProfile } from '../core/presentation/dexInfo';
import type { PhantomVersion } from '../core/presentation/phantom';
import type { Profile } from '../core/state';
import { silhouettes } from '../core/researchNotes';
import { services } from '../game/services';
import { playCry, playSfx } from './audio';
import type { InputAction } from './input';
import { phDex } from './phantom/screens/dex';
import { DEX_COLS, gridStep, phDexList, phTypes, TYPE_COLS, TYPE_ORDER } from './phantom/screens/dexbook';
import { monFile } from './redux/game';

const TABS = ['All', 'Seen', 'Owned', 'Mastered'] as const;
type Mode = 'list' | 'entry' | 'types';

export class PhantomDex {
  private readonly sets: CollectionSet[];
  private readonly hinted: Map<string, string[]>;
  private readonly profile: Profile;
  private readonly types: string[];
  private set = 0;
  private tab = 0;
  private index = 0;
  private mode: Mode = 'list';
  private from: 'list' | 'entry' = 'list';
  private pageNo: 0 | 1 = 0;
  private type = 0;
  private shown: string[] = [];
  private closed = false;
  private readonly unbind: () => void;

  /** `focus` is a species to open on (the lead of the run); `redraw` repaints the owner's view; `done` is called once on close. */
  constructor(private readonly scene: Phaser.Scene, private readonly redraw: () => void, private readonly done: () => void, focus?: string) {
    const { session } = services();
    this.sets = collectionSets(session.content);
    this.profile = liveDexProfile(session.profile, session.run?.log);
    this.hinted = silhouettes(session.content, this.profile);
    this.types = TYPE_ORDER.filter((t) => session.content.typeChart[t] !== undefined);
    // It opens on the lead's own page when the Pokédex knows the lead (a starter is not in it until it is met or caught).
    const known = focus && dexState(this.profile, focus) !== 'unknown' ? focus : undefined;
    if (known) this.set = Math.max(0, this.sets.findIndex((s) => s.members.includes(known)));
    this.fill();
    if (known) this.index = Math.max(0, this.shown.indexOf(known));
    const kb = scene.input.keyboard;
    const bind = (key: string, fn: () => void): (() => void) => {
      const h = (): void => { if (!this.closed) fn(); };
      kb?.on(`keydown-${key}`, h);
      return () => void kb?.off(`keydown-${key}`, h);
    };
    const offs = [bind('Q', () => this.go(this.mode === 'entry' ? 'types' : 'prev')), bind('E', () => this.go('next')), bind('C', () => this.go(this.mode === 'entry' ? 'cry' : 'tab')), bind('T', () => this.go('types'))];
    this.unbind = () => offs.forEach((off) => off());
    scene.events.once('shutdown', this.unbind);
  }

  /** The species of the set that pass the filter. */
  private fill(): void {
    const { session } = services();
    const tab = TABS[this.tab]!, set = this.sets[this.set];
    this.shown = (set?.members ?? []).filter((id) => {
      const st = dexState(this.profile, id);
      return tab === 'All' || (tab === 'Seen' && st !== 'unknown') || (tab === 'Owned' && st === 'caught') || (tab === 'Mastered' && ['gold', 'master'].includes(speciesRank(session.content, id, this.profile.mastery?.[id])));
    });
    this.index = Math.max(0, Math.min(this.index, this.shown.length - 1));
  }

  private tick(ok = true): void {
    playSfx(this.scene, ok ? 'ui.cursor' : 'ui.error', 0.5);
  }

  /** A named step: a key of the footer, a key of the keyboard, or a click. */
  go(name: string): void {
    if (this.closed) return;
    if (name === 'back') return this.input('back');
    if (name === 'types') {
      if (this.mode === 'types') return;
      this.from = this.mode;
      // The chart opens on the first type of the species that is being read, when it is one the player has met.
      const id = this.shown[this.index], { session } = services();
      const first = id && dexState(this.profile, id) !== 'unknown' ? session.content.species.get(id)?.types[0] : undefined;
      this.type = Math.max(0, this.types.indexOf(first ?? this.types[this.type] ?? 'normal'));
      this.mode = 'types';
      playSfx(this.scene, 'ui.select', 0.5);
      return this.redraw();
    }
    if (this.mode === 'types') return;
    if (this.mode === 'entry') {
      const id = this.shown[this.index], { session } = services();
      const known = !!id && dexState(this.profile, id) !== 'unknown';
      if (name === 'cry') { const sp = known ? session.content.species.get(id) : undefined; if (sp) playCry(this.scene, sp); return; }
      if (name === 'flip') { if (!known) return this.tick(false); this.pageNo = this.pageNo === 0 ? 1 : 0; this.tick(); return this.redraw(); }
      if (name === 'stepL' || name === 'stepR') {
        const n = this.shown.length;
        if (n < 2) return this.tick(false);
        this.index = (this.index + (name === 'stepL' ? n - 1 : 1)) % n;
        this.pageNo = 0;
        this.tick();
        return this.redraw();
      }
      return;
    }
    if (name === 'entry') return this.input('confirm');
    if (name === 'next' || name === 'prev') {
      const n = this.sets.length;
      if (n < 2) return this.tick(false);
      this.set = (this.set + (name === 'prev' ? n - 1 : 1)) % n;
      this.index = 0;
    } else if (name === 'tab') this.tab = (this.tab + 1) % TABS.length;
    else return;
    this.fill();
    this.tick();
    this.redraw();
  }

  /** A click on a cell: the first picks it, a second one on the same cell opens its entry. */
  pick(i: number): void {
    if (this.closed || this.mode !== 'list' || i < 0 || i >= this.shown.length) return;
    if (i === this.index) return this.input('confirm');
    this.index = i;
    this.tick();
    this.redraw();
  }

  /** The pointer over a cell or a type tile moves the cursor there. */
  over(i: number): void {
    if (this.closed || this.mode !== 'list' || i === this.index || i < 0 || i >= this.shown.length) return;
    this.index = i;
    this.redraw();
  }

  pickType(i: number): void {
    if (this.closed || this.mode !== 'types' || i === this.type || i < 0 || i >= this.types.length) return;
    this.type = i;
    this.tick();
    this.redraw();
  }

  input(action: InputAction): void {
    if (this.closed) return;
    if (this.mode === 'types') {
      if (action === 'back' || action === 'confirm') { this.mode = this.from; playSfx(this.scene, 'ui.select', 0.5); return this.redraw(); }
      const next = gridStep(this.type, this.types.length, TYPE_COLS, action);
      if (next === this.type) return;
      this.type = next;
      this.tick();
      return this.redraw();
    }
    if (this.mode === 'entry') {
      if (action === 'back' || action === 'confirm') { this.mode = 'list'; this.pageNo = 0; playSfx(this.scene, 'ui.select', 0.5); return this.redraw(); }
      return this.go(action === 'up' || action === 'down' ? 'flip' : action === 'left' ? 'stepL' : 'stepR');
    }
    if (action === 'back') return this.close();
    if (action === 'confirm') {
      if (!this.shown.length) return this.tick(false);
      this.mode = 'entry';
      this.pageNo = 0;
      playSfx(this.scene, 'ui.select', 0.5);
      return this.redraw();
    }
    const next = gridStep(this.index, this.shown.length, DEX_COLS, action);
    if (next === this.index) return;
    this.index = next;
    this.tick();
    this.redraw();
  }

  html(ph: PhantomVersion): string {
    const { session } = services(), content = session.content, profile = this.profile;
    if (this.mode === 'types') return phTypes(ph, { types: this.types, index: this.type, chart: content.typeChart });
    const id = this.shown[this.index];
    if (this.mode === 'entry' && id) {
      const card = dexCard(content, profile, id), data = dexDataPage(content, profile, id);
      return phDex(ph, { card, data, page: this.pageNo, art: monFile(this.scene, id, 'front'), line: card.line.map((e) => monFile(this.scene, e.id, 'front')), book: true });
    }
    const no = (x: string): string => String(content.species.get(x)?.dex ?? 0).padStart(4, '0');
    const totals = researchTotals(content, profile);
    const sp = id ? content.species.get(id) : undefined;
    let card = null;
    if (id && sp) {
      const unknown = dexState(profile, id) === 'unknown', shadow = this.hinted.get(id);
      const t = tallyOf(profile, id);
      const rank = unknown ? null : speciesRank(content, id, profile.mastery?.[id]);
      const goal = unknown ? null : nextGoal(content, id, profile.mastery?.[id]);
      const todo = goal ? goal.parts.filter((p) => p.current < p.target).map((p) => (p.target > 1 ? `${p.text} (${p.current} of ${p.target})` : p.text)).join(', ') : '';
      card = {
        no: no(id),
        name: unknown ? '???' : sp.name,
        types: unknown ? shadow ?? [] : sp.types,
        file: unknown && !shadow ? null : monFile(this.scene, id, 'front'),
        unknown,
        lines: unknown ? [shadow ? 'A shadow from your field notes. Not met yet.' : 'Not met yet. Meet it in a run to fill this page.'] : [`Seen ${t.seen} ${t.seen === 1 ? 'time' : 'times'} · Caught ${t.caught}`],
        rank: rank ? { name: RANK_NAMES[rank], at: Math.max(0, Math.min(4, rankIndex(rank) - 2)), next: goal ? `Next, ${RANK_NAMES[goal.rank]}: ${todo}` : 'Top rank' } : null,
      };
    }
    return phDexList(ph, {
      set: this.sets[this.set]?.name ?? 'Pokédex',
      tab: TABS[this.tab]!,
      seen: totals.met,
      caught: totals.caught,
      n: this.shown.length,
      cell: (i) => {
        const x = this.shown[i]!, unknown = dexState(profile, x) === 'unknown';
        return { no: no(x), file: unknown && !this.hinted.has(x) ? null : monFile(this.scene, x, 'front'), unknown };
      },
      index: this.index,
      card,
      sets: this.sets.length > 1,
    });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.unbind();
    this.scene.events.off('shutdown', this.unbind);
    this.done();
  }
}
