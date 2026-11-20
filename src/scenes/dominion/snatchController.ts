// DOMINION slice D23: the controller for the Holding Cell's questioning room (Rotom mockup a7), kept beside DominionScene
// so the scene only forwards to it. While a captive is being questioned it owns the screen, whatever page the Boss was
// on (a won Snatch Operation comes back to it; a reload too). Typed lines use the shared typing box (src/ui/typeBox.ts);
// every action goes through GameSession.dominionStep (saved). A typed line is judged by Rotom when a Key-Card is in
// (askClaude: stored in the run, so a reload never asks again) or by the rules; either way the rules decide what it does.

import { askClaude } from '../../ai/ask';
import { DOMINION_DATA } from '../../core/dominion/data';
import { inRoom, judgeAsk } from '../../core/dominion/snatch';
import { roomModel } from '../../core/dominion/snatchScreens';
import { dominionBlock } from '../../core/dominion/session';
import { APPROACHES, type DominionAction, type SnatchEnd, type SnatchGoal, type SnatchJudge } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { closeTypeBox, openTypeBox, typeBoxOpen } from '../../ui/typeBox';
import { roomView } from '../../ui/redux/screens/dominion/snatch';

interface Host {
  refresh(): void;
  snatchStep(a: DominionAction): { ok: boolean; notice: string | null };
  /** The room closed (an ending, or kept in the cell): the line goes on the page underneath. */
  roomDone(notice: string | null): void;
}

const DIGITS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4 };
const ENDS: readonly SnatchEnd[] = ['release', 'recruit', 'ransom'];
const GOALS: readonly SnatchGoal[] = ['info', 'extortion'];
const MAX = DOMINION_DATA.snatch.hit.maxText;

export class SnatchController {
  private busy = false;
  private alive = true;
  private notice: string | null = null;
  private pick = 0;
  private seen = new WeakSet<KeyboardEvent>();

  constructor(private readonly host: Host) {}

  shutdown(): void {
    this.alive = false;
    closeTypeBox();
  }

  private block() {
    return dominionBlock(services().session.run);
  }

  /** True while a captive is being questioned. */
  owns(): boolean {
    const b = this.block();
    return !!b && !!inRoom(b);
  }

  render(): string {
    const b = this.block();
    const m = b ? roomModel(b) : null;
    return m ? roomView(m, { typing: typeBoxOpen(), busy: this.busy, notice: this.notice, pick: this.pick }) : '';
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      sGoal: (g) => this.goal(g as SnatchGoal),
      sGoalPick: () => { this.pick = 1 - this.pick; this.host.refresh(); },
      sGoalGo: () => this.goal(GOALS[this.pick]!),
      sSay: (a) => this.say(a as (typeof APPROACHES)[number]),
      sType: () => this.openBox(),
      sStop: () => this.run({ t: 'sStop' }),
      sEnd: (how) => this.end(how as SnatchEnd),
    };
  }

  private run(a: DominionAction): boolean {
    if (this.busy || typeBoxOpen()) return false;
    const out = this.host.snatchStep(a);
    this.notice = out.ok ? null : out.notice;
    this.host.refresh();
    return out.ok;
  }

  private goal(g: SnatchGoal): void {
    if (inRoom(this.block()!)?.phase !== 'goal') return;
    this.pick = GOALS.indexOf(g);
    this.run({ t: 'sGoal', goal: g });
  }

  private say(kind: (typeof APPROACHES)[number]): void {
    if (inRoom(this.block()!)?.phase !== 'talk') return;
    this.run({ t: 'sSay', kind });
  }

  private end(how: SnatchEnd): void {
    const c = inRoom(this.block()!);
    if (!c || (how !== 'keep' && c.phase !== 'end') || this.busy || typeBoxOpen()) return;
    const out = this.host.snatchStep({ t: 'sEnd', how });
    if (!out.ok) {
      this.notice = out.notice;
      return this.host.refresh();
    }
    this.notice = null;
    this.pick = 0;
    this.host.roomDone(out.notice);
  }

  /** T: the shared typing box. Enter sends, Esc cancels. */
  private openBox(): void {
    const c = inRoom(this.block()!);
    if (!c || c.phase !== 'talk' || this.busy || typeBoxOpen()) return;
    this.notice = null;
    openTypeBox({
      title: `Your own words to ${c.name}`,
      placeholder: 'Your boss already sold you out. The patrol sheet, or the front page.',
      maxChars: MAX,
      onSend: (text) => { if (this.alive) void this.submit(text); },
      onClose: () => { if (this.alive) this.host.refresh(); },
    });
    this.host.refresh();
  }

  /** A typed line: Rotom judges it when it can (stored with the run), else the rules do. */
  private async submit(typed: string): Promise<void> {
    const text = typed.trim().slice(0, MAX);
    const b = this.block();
    const c = b ? inRoom(b) : null;
    if (!text || !b || !c || this.busy) return;
    const ask = judgeAsk(b, text);
    if (!ask) return;
    const at = { n: c.n, said: c.said };
    this.busy = true;
    this.host.refresh();
    let judge: SnatchJudge = ask.offline();
    let rotom = false;
    const env = services().session.aiEnv();
    if (env) {
      try {
        const got = await askClaude({ id: ask.id, role: 'judge', use: 'typed', system: ask.system, context: ask.context, input: ask.input, schema: ask.schema, offline: ask.offline }, env);
        judge = got.value;
        rotom = got.source !== 'offline';
      } catch {
        // The rules' judge stands.
      }
    }
    this.busy = false;
    if (!this.alive) return;
    // The run moved on while Rotom thought: the line belongs to that moment only.
    const now = this.block() ? inRoom(this.block()!) : null;
    if (!now || now.n !== at.n || now.said !== at.said) return this.host.refresh();
    this.run({ t: 'sSay', kind: 'typed', text, judge, rotom });
  }

  /** Raw keys first: digits, T, I and E. The typing box takes every key itself while open. */
  raw(e: KeyboardEvent): boolean {
    if (!this.owns()) return false;
    if (this.seen.has(e)) return true;
    this.seen.add(e);
    const c = inRoom(this.block()!)!;
    if (this.busy || typeBoxOpen()) return true;
    if (c.phase === 'goal') {
      if (e.code === 'KeyI') this.goal('info');
      else if (e.code === 'KeyE') this.goal('extortion');
      return true;
    }
    if (e.code in DIGITS) {
      const i = DIGITS[e.code]!;
      if (c.phase === 'talk' && APPROACHES[i]) this.say(APPROACHES[i]);
      else if (c.phase === 'end' && ENDS[i]) this.end(ENDS[i]);
      return true;
    }
    if (e.code === 'KeyT' && c.phase === 'talk') {
      e.preventDefault();
      if (!e.repeat) this.openBox();
    }
    return true;
  }

  /** Arrows, Enter and Esc. */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.busy || typeBoxOpen()) return true;
    const c = inRoom(this.block()!)!;
    if (c.phase === 'goal') {
      if (a === 'left' || a === 'right' || a === 'up' || a === 'down') {
        this.pick = 1 - this.pick;
        this.host.refresh();
      } else if (a === 'confirm') this.goal(GOALS[this.pick]!);
      return true;
    }
    if (a === 'back') {
      if (c.phase === 'talk') this.run({ t: 'sStop' });
      else this.end('keep');
    } else if (a === 'confirm' && this.notice) {
      this.notice = null;
      this.host.refresh();
    }
    return true;
  }
}
