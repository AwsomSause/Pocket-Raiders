// DOMINION slice D30: the controller for the job moments (m8 Boss order cut-in, m9 Job done, m10 Job botched) and the
// morning paper (m12), kept beside DominionScene.
//
// Do it has already played and saved the act when `start` is called: this only shows it. The cut-in lasts under two
// seconds (Enter skips it; the Cut-ins setting skips it entirely), then the job goes on to whatever it was waiting on
// (a battle, the Hero's interrupt) or to its result page. Leaving the game mid-moment loses nothing: the result is in
// the save. The paper shows once per Morning from Day 2 (folding it changes nothing in the run).

import { MOMENTS, jobModel, orderModel, paperDue, paperModel, type ActInput, type JobModel, type OrderModel, type Roll } from '../../core/dominion/moments';
import { teamColours } from '../../core/dominion/founding';
import { topModel } from '../../core/dominion/screens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionBlock } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { cutInsOn, momentsOn, stillFx } from '../../ui/redux/screens/dominion/cutins';
import { jobBotchedView, jobDoneView, orderView, paperView } from '../../ui/redux/screens/dominion/moments';

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
  /** Back to the Map (`next`: straight to the Card of the next action on the board). */
  toMap(next: boolean): void;
  /** True when the HQ shows with nothing else on it (the paper's place). */
  onMorningHq(): boolean;
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
  /** The day whose paper was folded (kept for the game session, not saved: a page reload shows the Morning's paper again). */
  private folded = 0;

  constructor(private readonly host: Host) {}

  private block(): DominionBlock | null {
    return dominionBlock(services().session.run) ?? null;
  }

  /** A job moment is on screen. */
  owns(): boolean {
    return this.stage !== null;
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

  private close(next: boolean): void {
    const caught = !!this.job?.caught;
    this.stage = null;
    this.job = null;
    this.token++;
    // Someone was caught: D24's questioning owns the screen now; the Map waits under it.
    this.host.toMap(next && !caught);
  }

  render(): string {
    const s = services().session, b = this.block();
    const team = b ? teamColours(b) : null, still = stillFx(s.settings);
    if (this.stage === 'order' && this.order) return orderView(this.order, team, still);
    if (this.stage === 'result' && this.job && b) {
      return this.job.kind === 'done' ? jobDoneView(this.job, { ...topModel(b), regionLabel: 'JOB', region: (this.job.title.split(' · ')[1] ?? this.job.title).toUpperCase() }, team, still) : jobBotchedView(this.job, MOMENTS.botched, this.at, team, still);
    }
    return '';
  }

  renderPaper(): string {
    const run = services().session.run, b = this.block();
    return run && b ? paperView(paperModel(b, run.seed, run.ai), teamColours(b)) : '';
  }

  private choices(): number {
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
      else if (a === 'confirm') this.close(this.job?.kind === 'botched' && this.at === 1);
      else if (a === 'back') this.close(false);
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
    if (this.stage === 'result' && code === 'KeyN' && !this.job?.caught) {
      this.close(true);
      return true;
    }
    return this.owns() || this.paperOwns();
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
      jobNext: () => { if (this.stage === 'result') this.close(true); },
      paperFold: () => this.fold(),
    };
  }
}
