// DOMINION slice D21: the controller for the applications desk (Rotom mockup k5), beside DominionScene so the scene
// only forwards to it. It keeps the cursors; every change goes through GameSession.dominionStep (saved). After a
// question it asks Rotom (askClaude) for the applicant's spoken reply and tell; without a Key-Card the written answer
// stands. Rotom's answer is stored in the run (`run.ai`) and read back on every redraw and reload.

import { askClaude } from '../../ai/ask';
import { wrapPlayerText, AI_DATA } from '../../core/ai/rules';
import { current, deskModel, deskTalk, DeskReplySchema } from '../../core/dominion/desk';
import { DOMINION_DATA } from '../../core/dominion/data';
import { dominionBlock } from '../../core/dominion/session';
import { VERDICTS, type DominionAction, type Verdict } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { deskView, type DeskUi } from '../../ui/redux/screens/dominion/desk';
import { closeTypeBox, openTypeBox, typeBoxOpen } from '../../ui/typeBox';

interface Host {
  screenName: string;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
}

const STAMP_KEYS: Record<string, Verdict> = { KeyA: 'accept', KeyR: 'reject', KeyD: 'detain' };

export class DeskController {
  private ui: DeskUi = { mode: 'ask', qAt: 0, fAt: 0, stampAt: null };
  /** Rotom calls in flight (call ids). */
  private pending = new Set<string>();
  /** The last key code, so A and D (also ◀ ▶ in the game's key map) stamp here instead of moving. */
  private lastCode = '';
  private alive = true;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'desk';
  }

  /** Opens the desk (from the HQ chip or key I). */
  open(): void {
    this.host.step({ t: 'desk' });
    this.host.screenName = 'desk';
    this.ui = { mode: 'ask', qAt: 0, fAt: 0, stampAt: null };
    this.host.setNotice(null);
    this.host.refresh();
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    const run = services().session.run!;
    const env = services().session.aiEnv();
    const m = deskModel(b, run.seed, run.ai, this.pending, !!env && env.tier !== 'off' && !!env.keys.active());
    this.ui.qAt = Math.min(this.ui.qAt, m.questions.length);
    return deskView(m, this.ui, notice);
  }

  shutdown(): void {
    this.alive = false;
    closeTypeBox();
  }

  /** Tap targets (data-act). One shared table with the scene and the crew: every name starts with `desk`. */
  acts(): Record<string, (arg: string) => void> {
    return {
      deskAsk: (i) => { this.ui = { ...this.ui, mode: 'ask', qAt: Number(i) }; this.askPicked(); },
      deskField: (i) => { this.ui = { ...this.ui, mode: 'inspect', fAt: Number(i) }; this.inspectPicked(); },
      deskStamp: (v) => { if ((VERDICTS as readonly string[]).includes(v)) this.stamp(v as Verdict); },
      deskInspect: () => this.toggleInspect(),
      deskType: () => this.typeQuestion(),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { deskStampOver: (v) => { this.ui.stampAt = (VERDICTS as readonly string[]).includes(v) ? (v as Verdict) : null; this.host.refresh(); } };
  }

  /** Remembers the key (capture phase, before the game's key map turns A/D into ◀ ▶). Tab is stopped here, at once:
   * the game reads keys a frame later, and by then the browser would have moved the focus onto a button. Tab toggles
   * Inspect; T opens the Type box. */
  note(e: KeyboardEvent): void {
    this.lastCode = e.code;
    if ((e.code !== 'Tab' && e.code !== 'KeyT') || !this.owns() || typeBoxOpen()) return;
    // Phaser skips a key whose default was stopped, so these two are handled right here. (T is stopped so its letter
    // doesn't land in the box it opens.)
    e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Tab') this.toggleInspect();
    else this.typeQuestion();
  }

  /** Letter keys on the desk. Returns true when handled. */
  raw(e: KeyboardEvent): boolean {
    if (!this.owns() || typeBoxOpen()) return false;
    const v = STAMP_KEYS[e.code];
    if (v) return this.stamp(v), true;
    return false;
  }

  /** Arrows, Enter and Esc on the desk. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (typeBoxOpen()) return true;
    // A and D are stamps here, not ◀ ▶ (the raw handler stamped already).
    if ((a === 'left' || a === 'right') && (this.lastCode === 'KeyA' || this.lastCode === 'KeyD')) return true;
    const b = this.block();
    const run = services().session.run;
    if (!b || !run) return true;
    const m = deskModel(b, run.seed, run.ai, this.pending);
    if (a === 'back') {
      if (this.ui.mode === 'inspect') this.ui.mode = 'ask';
      else {
        this.host.screenName = 'hq';
        this.host.setNotice(null);
      }
      return true;
    }
    if (m.state !== 'open') return true;
    const dir = a === 'left' || a === 'up' ? -1 : a === 'right' || a === 'down' ? 1 : 0;
    if (this.ui.mode === 'inspect') {
      const n = m.fields.length;
      if (dir) this.ui.fAt = (this.ui.fAt + dir + n) % n;
      else if (a === 'confirm') this.inspectPicked();
    } else {
      const n = m.questions.length + 1;
      if (dir) this.ui.qAt = (this.ui.qAt + dir + n) % n;
      else if (a === 'confirm') this.askPicked();
    }
    return true;
  }

  private toggleInspect(): void {
    this.ui.mode = this.ui.mode === 'inspect' ? 'ask' : 'inspect';
    this.host.refresh();
  }

  private inspectPicked(): void {
    const f = DOMINION_DATA.desk.fields[this.ui.fAt];
    if (f) this.host.step({ t: 'deskInspect', field: f.id });
  }

  private askPicked(): void {
    const b = this.block();
    const a = b ? current(b) : null;
    if (!a) return;
    if (this.ui.qAt >= a.qs.length) return this.typeQuestion();
    const q = a.qs[this.ui.qAt]!;
    if (this.host.step({ t: 'deskAsk', q })) this.voice(a.id);
  }

  private typeQuestion(): void {
    const b = this.block();
    const a = b ? current(b) : null;
    if (!a || typeBoxOpen()) return;
    this.ui.qAt = a.qs.length;
    this.host.refresh();
    openTypeBox({
      title: `Ask ${a.name.split(' ')[0]} anything`,
      placeholder: 'Lavender\'s got a tower. What\'s on the top floor?',
      maxChars: AI_DATA.playerText.maxChars,
      onSend: (text) => { if (this.alive && this.host.step({ t: 'deskAsk', q: 'typed', text })) this.voice(a.id); },
      onClose: () => this.alive && this.host.refresh(),
    });
  }

  /** After a question: Rotom voices the applicant (stored in the run); offline the written answer stands. */
  private voice(applicantId: string): void {
    const session = services().session;
    const run = session.run;
    const b = this.block();
    const env = session.aiEnv();
    const a = b?.desk?.queue.find((x) => x.id === applicantId);
    if (!run || !b || !env || !a) return;
    const talk = deskTalk(b, run.seed, applicantId, a.asked.length - 1, (t) => wrapPlayerText(t));
    if (!talk) return;
    this.pending.add(talk.id);
    this.host.refresh();
    void askClaude({
      id: talk.id, role: 'line', ...(talk.typed ? { use: 'typed' as const } : {}),
      system: talk.system, context: talk.context, input: talk.input, schema: DeskReplySchema, offline: () => talk.offline,
    }, env).catch(() => null).finally(() => {
      this.pending.delete(talk.id);
      if (this.alive) this.host.refresh();
    });
  }

  private stamp(v: Verdict): void {
    if (this.host.step({ t: 'deskStamp', stamp: v })) this.ui = { mode: 'ask', qAt: 0, fAt: 0, stampAt: null };
  }
}
