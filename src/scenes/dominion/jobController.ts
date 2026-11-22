// DOMINION slice D30: the controller for the job moments (m8 Boss order cut-in, m9 Job done, m10 Job botched) and the
// morning paper (m12), kept beside DominionScene.
//
// Do it has already played and saved the act when `start` is called: this only shows it. The cut-in lasts under two
// seconds (Enter skips it; the Cut-ins setting skips it entirely), then the job goes on to whatever it was waiting on
// (a battle, the Hero's interrupt) or to its result page. Leaving the game mid-moment loses nothing: the result is in
// the save. The paper shows once per Morning from Day 2 (folding it changes nothing in the run).

import { MOMENTS, caughtModel, jobModel, orderModel, paperDue, paperModel, type ActInput, type CaughtModel, type JobModel, type OrderModel, type Roll } from '../../core/dominion/moments';
import { teamColours } from '../../core/dominion/founding';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionBlock } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { cutInsOn, momentsOn } from '../../ui/redux/screens/dominion/cutins';
import { paperView } from '../../ui/redux/screens/dominion/moments';
import { r5Botched, r5Done, r5Order, type R5Person } from '../../ui/redux/screens/dominion/r50/jobs';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';

/** What the job goes on to after the cut-in. */
export type JobNext = 'fight' | 'hero' | 'result';

interface Host {
  refresh(): void;
  /** Runs `fn` after `ms` (the scene's clock, so it stops with the scene). */
  later(ms: number, fn: () => void): void;
  /** Starts the battle the job waits on. */
  fight(): void;
  /** Shows the Hero's interrupt. */
  interrupt(): void;
  /** Back to the Map (`next`: straight to the Card of the next action on the board), with a line to show there. */
  toMap(next: boolean, notice: string | null): void;
  /** True when the HQ shows with nothing else on it (the paper's place). */
  onMorningHq(): boolean;
  /** Redesign R4: the chrome's run data and the people the pages draw (the Boss, a member by name). */
  r5(): { run: R5Run; boss: R5Person; member: (id: string | null, name?: string) => R5Person | null } | null;
  /** Redesign R4: a calling card can be left for the job just done; open its page (C on Job done). */
  callingDue?(): boolean;
  openCalling?(): boolean;
}

/** The cut-in's length: under two seconds (m8). */
export const ORDER_MS = 1800;

export class JobController {
  private stage: 'order' | 'result' | null = null;
  private order: OrderModel | null = null;
  private job: JobModel | null = null;
  private next: JobNext = 'result';
  private token = 0;
  private at = 0;
  /** A line on the result page (a choice that can't be made). */
  private note: string | null = null;
  /** The day whose paper was folded (kept for the game session, not saved: a page reload shows the Morning's paper again). */
  private folded = 0;

  constructor(private readonly host: Host) {}

  private block(): DominionBlock | null {
    return dominionBlock(services().session.run) ?? null;
  }

  /** A member waiting in custody on Bail / Break out / Leave (m10), shown again after a reload. */
  private pending(): CaughtModel | null {
    const b = this.block();
    return b && momentsOn() ? caughtModel(b) : null;
  }

  /** A job moment is on screen (or a caught member still waits for an answer). */
  owns(): boolean {
    if (this.stage === null && this.pending()) this.reopen();
    return this.stage !== null;
  }

  /** The botched page for a member still in custody (after a reload: the act's own numbers are gone, the choice isn't). */
  private reopen(): void {
    const cm = this.pending()!;
    const B = MOMENTS.botched;
    this.job = {
      kind: 'botched', big: false, title: cm.action, rolled: '', stamp: B.stamp, take: 0, changes: [], weekly: null,
      member: { name: cm.member.name, look: cm.member.look }, caught: cm.member.name, held: 'member',
      head: B.caught.replace('{who}', cm.member.name), quote: null, lines: '',
    };
    this.stage = 'result';
    this.at = 0;
  }

  /** The morning paper is on screen. */
  paperOwns(): boolean {
    const b = this.block();
    return !this.owns() && !!b && momentsOn() && paperDue(b) && this.folded !== b.day && this.host.onMorningHq();
  }

  /**
   * Do it played (`before` is the block before it). Returns false when the moments are off, so the scene keeps the
   * old notice line. `next` is what the act left waiting.
   */
  start(before: DominionBlock, a: ActInput, roll: Roll | null, notice: string | null, next: JobNext): boolean {
    const run = services().session.run, after = this.block();
    if (!momentsOn() || !run || !after) return false;
    this.next = next;
    this.at = 0;
    this.note = null;
    this.job = next === 'result' ? jobModel(before, after, run, a, roll, notice) : null;
    if (next === 'result' && !this.job) return false;
    this.order = orderModel(before, run, a);
    const t = ++this.token;
    if (this.order && cutInsOn(services().session.settings)) {
      this.stage = 'order';
      this.host.later(ORDER_MS, () => { if (this.token === t && this.stage === 'order') this.advance(); });
      this.host.refresh();
    } else this.advance();
    return true;
  }

  /** The cut-in ends (its time ran out, or Enter): on to the battle, the Hero or the result page. */
  private advance(): void {
    this.order = null;
    if (this.next === 'fight') {
      this.stage = null;
      return this.host.fight();
    }
    if (this.next === 'hero') {
      this.stage = null;
      return this.host.interrupt();
    }
    this.stage = 'result';
    this.host.refresh();
  }

  private close(next: boolean, notice: string | null = null): void {
    const caught = !!this.job?.caught;
    this.stage = null;
    this.job = null;
    this.note = null;
    this.token++;
    // Someone was caught: D24's questioning owns the screen now (or tonight); the Map waits under it.
    this.host.toMap(next && !caught, notice);
  }

  /** m10: Bail (0), Break out (1) or Leave (2) for a caught member. The session plays and saves it. */
  private answer(i: number): void {
    const cm = this.pending();
    const c = cm?.choices[i];
    if (!cm || !c) return;
    if (!c.on) {
      this.note = c.sub;
      return this.host.refresh();
    }
    const out = services().session.dominionStep({ t: 'jobCaught', choice: c.id });
    if (!out.ok) {
      this.note = out.notice;
      return this.host.refresh();
    }
    this.close(false, out.notice);
  }

  render(): string {
    const b = this.block(), r = this.host.r5();
    if (!b || !r) return '';
    if (this.stage === 'order' && this.order) {
      const crew = this.order.crew ? r.member(null, this.order.crew.name) : null;
      return r5Order(this.order, r.boss, crew, r.run);
    }
    if (this.stage === 'result' && this.job) {
      const j = this.job;
      const place = (j.title.split(' · ')[1] ?? '').trim() || (r.run.place ?? '');
      const x = {
        member: j.member ? r.member(null, j.member.name) : null, day: b.day, place, at: this.at, note: this.note,
        held: j.held === 'member' ? this.pending()?.choices ?? null : null, texts: MOMENTS.botched, calling: j.kind === 'done' && !!this.host.callingDue?.(),
      };
      return j.kind === 'done' ? r5Done(j, x, r.run) : r5Botched(j, x, r.run);
    }
    return '';
  }

  renderPaper(): string {
    const run = services().session.run, b = this.block();
    return run && b ? paperView(paperModel(b, run.seed, run.ai), teamColours(b)) : '';
  }

  private choices(): number {
    if (this.job?.held === 'member' && this.pending()) return 3;
    return this.job?.kind === 'botched' && !this.job.caught ? 2 : 1;
  }

  /** Enter skips the cut-in, then picks on the result page; Esc on the result page goes to the Map. */
  key(a: InputAction): boolean {
    if (this.stage === 'order') {
      if (a === 'confirm') this.advance();
      return true;
    }
    if (this.stage === 'result') {
      const n = this.choices();
      if (a === 'up' || a === 'left') this.at = (this.at + n - 1) % n;
      else if (a === 'down' || a === 'right') this.at = (this.at + 1) % n;
      else if (a === 'confirm' && this.job?.held === 'member' && this.pending()) {
        this.answer(this.at);
        return true;
      } else if (a === 'confirm') this.close(this.job?.kind === 'botched' && this.at === 1);
      // Esc never walks away from a caught member: one of the three must be picked.
      else if (a === 'back' && !(this.job?.held === 'member' && this.pending())) this.close(false);
      this.host.refresh();
      return true;
    }
    if (this.paperOwns()) {
      if (a === 'confirm' || a === 'back') this.fold();
      return true;
    }
    return false;
  }

  /** N is Next action on the result page; other letters do nothing while a moment or the paper is up. */
  raw(code: string): boolean {
    if (this.stage === 'result' && code === 'KeyC' && this.job?.kind === 'done' && this.host.openCalling?.()) return true;
    if (this.stage === 'result' && code === 'KeyN' && !this.job?.caught) {
      this.close(true);
      return true;
    }
    const d = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
    if (this.stage === 'result' && d >= 0 && this.job?.held === 'member' && this.pending()) {
      this.at = d;
      this.answer(d);
      return true;
    }
    return this.owns() || this.paperOwns();
  }

  /** Redesign R4: a line for the result page (the calling card left). */
  say(line: string | null): void {
    if (this.stage === 'result') this.note = line;
  }

  fold(): void {
    const b = this.block();
    if (b) this.folded = b.day;
    this.host.refresh();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      jobSkip: () => { if (this.stage === 'order') this.advance(); },
      jobMap: () => { if (this.stage === 'result') this.close(false); },
      jobCaught: (i) => { if (this.stage === 'result') { this.at = Number(i); this.answer(Number(i)); } },
      jobNext: () => { if (this.stage === 'result') this.close(true); },
      paperFold: () => this.fold(),
    };
  }
}
