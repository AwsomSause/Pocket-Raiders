// DOMINION slice D13: the controller for the Debate (mockup 8), kept beside DominionScene so the scene only forwards to
// it. It keeps the cursor (stance, line, the Convinced pick); every turn goes through GameSession.dominionStep (saved).
// Keys: 1-4 or ◀▶ pick a stance, ▲▼ a set line, Enter argues; Esc walks out (asked twice). Convinced: 1 Merger, 2 Branch.

import { DOMINION_DATA } from '../../core/dominion/data';
import { debateModel, type DebateCursor } from '../../core/dominion/debateScreens';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { debateView } from '../../ui/redux/screens/dominion/debate';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy' | 'takeover' | 'broadcast';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  debateStep(a: DominionAction): { ok: boolean; notice: string | null };
}

const STANCE_KEYS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };

export class DebateController {
  private cur: DebateCursor = { stance: 0, line: 0 };
  private notice: string | null = null;
  private leaving = false;

  constructor(private readonly host: Host) {}

  private live() {
    return dominionBlock(services().session.run)?.debate?.live ?? null;
  }
  private active(): boolean {
    return this.host.screenName === 'debate';
  }

  /** A Debate is on the table: show it (after the Debate action, a card answered, or a reload). */
  claim(): boolean {
    if (!this.live() || this.active()) return false;
    this.host.screenName = 'debate';
    this.cur = { stance: 0, line: 0 };
    this.notice = null;
    this.leaving = false;
    this.firstFree();
    return true;
  }

  render(): string {
    const b = dominionBlock(services().session.run);
    const m = b ? debateModel(b, this.cur, this.notice) : null;
    return m ? debateView(m) : '';
  }

  /** The stance's first line not said yet. */
  private firstFree(): void {
    const used = new Set(this.live()?.turns.map((t) => t.line) ?? []);
    const st = DOMINION_DATA.debate.stances[this.cur.stance]!.id;
    const lines = DOMINION_DATA.debate.lines.filter((l) => l.stance === st);
    const i = lines.findIndex((l) => !used.has(l.id));
    this.cur = { ...this.cur, line: Math.max(0, i) };
  }

  private stance(i: number): void {
    this.cur = { stance: (i + 4) % 4, line: 0 };
    this.notice = null;
    this.leaving = false;
    this.firstFree();
  }

  private send(a: DominionAction): void {
    const out = this.host.debateStep(a);
    this.notice = out.ok ? null : out.notice;
    this.leaving = false;
    if (!out.ok) return;
    if (!this.live()) {
      // The result was read (or you walked out): back to the HQ with what happened.
      this.host.screenName = 'hq';
      this.host.setNotice(out.notice);
      return;
    }
    this.firstFree();
  }

  private argue(): void {
    const l = this.live();
    if (!l) return;
    if (l.phase === 'done') return this.send({ t: 'debateDone' });
    if (l.phase !== 'argue') return;
    const st = DOMINION_DATA.debate.stances[this.cur.stance]!.id;
    const line = DOMINION_DATA.debate.lines.filter((x) => x.stance === st)[this.cur.line];
    if (line) this.send({ t: 'argue', line: line.id });
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      debStance: (i) => { this.stance(Number(i)); this.host.refresh(); },
      debLine: (i) => { this.cur = { ...this.cur, line: Number(i) }; this.host.refresh(); },
      debArgue: () => { this.argue(); this.host.refresh(); },
      debDeal: (k) => { this.send({ t: 'deal', kind: k === 'merger' ? 'merger' : 'branch' }); this.host.refresh(); },
      debDone: () => { this.send({ t: 'debateDone' }); this.host.refresh(); },
    };
  }

  /** Arrows, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const l = this.live();
    if (!l) {
      this.host.screenName = 'hq';
      return true;
    }
    if (this.notice && a === 'confirm') {
      this.notice = null;
      this.leaving = false;
      return true;
    }
    if (a === 'back') {
      if (l.phase === 'done') this.send({ t: 'debateDone' });
      else if (l.phase === 'argue') {
        if (this.leaving) this.send({ t: 'walkOut' });
        else {
          this.leaving = true;
          this.notice = `Walk out on ${l.name}? It counts as a failed Debate. Esc again to walk out, Enter to stay.`;
        }
      }
      return true;
    }
    if (l.phase === 'argue') {
      if (a === 'left' || a === 'right') this.stance(this.cur.stance + (a === 'left' ? -1 : 1));
      else if (a === 'up' || a === 'down') this.cur = { ...this.cur, line: (this.cur.line + (a === 'up' ? 2 : 1)) % 3 };
      else if (a === 'confirm') this.argue();
    } else if (l.phase === 'done' && a === 'confirm') this.send({ t: 'debateDone' });
    return true;
  }

  /** Number keys: 1-4 pick a stance; Convinced: 1 Merger, 2 Branch. */
  raw(code: string): boolean {
    if (!this.active()) return false;
    const l = this.live();
    const i = STANCE_KEYS[code];
    if (i === undefined || !l) return true;
    if (l.phase === 'choose') {
      if (i < 2) this.send({ t: 'deal', kind: i === 0 ? 'merger' : 'branch' });
    } else if (l.phase === 'argue') this.stance(i);
    this.host.refresh();
    return true;
  }

  dismiss(): void {
    this.notice = null;
    this.leaving = false;
  }
}
